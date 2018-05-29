
import time
import sys
import os
import logging
import threading
import signal
from multiprocessing import Process, Queue

from blue_pair.simulator import Simulator

L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)


class Sim(object):
    def __init__(self, config, cb):
        self.config = config
        self.cb = cb
        self.id = None


class SimManager(object):
    def __init__(self):
        self._sims = []
        self._current_sim = None
        self.next_sim_id = 0
        self._result_queue = Queue()
        self.queueLength = 0
        self._watcher_thread = None
        self._sim_proc = None

        self._start_sim_result_watcher()

    def create_sim(self, simulator_config, cb):
        sim_id = self.next_sim_id
        self.next_sim_id += 1

        sim = Sim(simulator_config, cb)
        sim.id = sim_id

        if self._current_sim is None:
            self._current_sim = sim
            self._start_sim()
        else:
            self._sims.append(sim)
            self.queueLength = len(self._sims + 1)

        return sim_id

    def cancel_sim(self, sim_id):
        if (self._current_sim.id == sim_id):

    def _start_sim_result_watcher(self):
        def watcher():
            def get_queue_traces():
                return self._result_queue.get()
            while True:
                result = get_queue_traces()
                if result is not None:
                    self._current_sim.cb(result)
                else:
                    L.debug('waiting for simulator process to terminate')
                    self._sim_proc.join()
                    L.debug('simulator process has been terminated')
                    if len(self._sims) > 0:
                        L.debug('proceeding with simulations from the queue')
                        self._current_sim = self._sims.pop(0)
                        self._start_sim()
                    else:
                        L.debug('no simulations in the queue')
                        self._current_sim = None

        self._watcher_thread = threading.Thread(target=watcher)
        self._watcher_thread.start()

    def _start_sim(self):
        def simulation_runner(result_queue, sim_config):
            def on_progress():
                trace_diff = simulator.get_trace_diff()
                result_queue.put(trace_diff)
                time.sleep(0.001)
            simulator = Simulator(sim_config, on_progress)
            simulator.run()
            result_queue.put(None)
        self._sim_proc = Process(target=simulation_runner, args=(self._result_queue, self._current_sim.config))
        self._sim_proc.start()
        L.debug('simulator process has been started')
