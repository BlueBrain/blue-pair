
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


class SimData(object):
    def __init__(self, sim_status, data=None):
        self.status = sim_status
        self.data = data


class SimStatus(object):
    def __init__(self):
        self.QUEUE = 0
        self.INIT = 1
        self.RUN = 2
        self.FINISH = 3

        # artificial statuses to pass to sim watcher thread
        # to terminate it with running simulation
        # in case of app shutdown
        self.TERMINATE = 4


STATUS = SimStatus()


class SimManager(object):
    def __init__(self):
        self._sims = []
        self._current_sim = None
        self.next_sim_id = 0
        # TODO: switch to using Pipe as faster alternative
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

        self._sims.append(sim)

        if self._current_sim is None:
            self._run_next()

        return sim_id

    def cancel_sim(self, sim_id):
        if self._current_sim and self._current_sim.id == sim_id:
            L.debug('cancelling current simulation')
            os.kill(self._sim_proc.pid, signal.SIGINT)
        else:
            sim_index = self._sims.index(filter(lambda s: s.id == sim_id, self._sims)[0])
            L.debug('cancelling simulation id: %s, with index: %s', sim_id, sim_index)
            self._sims.pop(sim_index)

    def _run_next(self):
        self.queueLength = len(self._sims)

        L.debug('sending sim queue positions')
        for index, sim in enumerate(self._sims):
            sim_data = SimData(STATUS.QUEUE, index)
            sim.cb(sim_data)

        if self.queueLength > 0:
            L.debug('proceeding with simulations from the queue')
            self._current_sim = self._sims.pop(0)
            self._start_sim()
        else:
            L.debug('no simulations in the queue')
            self._current_sim = None

    def terminate(self):
        if self._current_sim is not None:
            L.debug('terminating sim process')
            self._sim_proc.terminate()
        sim_data = SimData(STATUS.TERMINATE)
        self._result_queue.put(sim_data)

    def _start_sim_result_watcher(self):
        def watcher():
            while True:
                sim_data = self._result_queue.get()

                if self._current_sim:
                    self._current_sim.cb(sim_data)

                if sim_data.status == STATUS.TERMINATE:
                    L.debug('terminating sim result watcher thread')
                    break

                elif sim_data.status == STATUS.FINISH:
                    L.debug('waiting for simulator process to terminate')
                    self._sim_proc.join()
                    self._sim_proc = None
                    self._current_sim = None
                    L.debug('simulator process has been terminated')
                    self._run_next()

        self._watcher_thread = threading.Thread(target=watcher)
        self._watcher_thread.start()

    def _start_sim(self):
        def simulation_runner(result_queue, sim_config):
            def on_sigint(signal, frame):
                sim_finish = SimData(STATUS.FINISH)
                result_queue.put(sim_finish)
                sys.exit(0)

            signal.signal(signal.SIGINT, on_sigint)

            def on_progress():
                trace_diff = simulator.get_trace_diff()
                sim_data = SimData(STATUS.RUN, trace_diff)

                result_queue.put(sim_data)
                time.sleep(0.001)

            sim_init = SimData(STATUS.INIT)
            result_queue.put(sim_init)

            simulator = Simulator(sim_config, on_progress)
            simulator.run()

            sim_finish = SimData(STATUS.FINISH)
            result_queue.put(sim_finish)
        self._sim_proc = Process(target=simulation_runner, args=(self._result_queue, self._current_sim.config))
        self._sim_proc.start()
        L.debug('simulator process has been started')

