
import os
import logging

from multiprocessing import Queue, Process

import bglibpy


L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']


def get_sim_traces(sim_config):
    mp_queue = Queue()
    mp_process = Process(target=get_sim_traces_mp, args=(mp_queue, sim_config))
    mp_process.start()
    traces = mp_queue.get()
    mp_process.join()
    return traces


def get_sim_traces_mp(mp_queue, sim_config):
    sim = Sim(sim_config)
    sim.run()
    traces = sim.get_traces()
    # TODO: add progress
    mp_queue.put(traces)


class Sim(object):
    def __init__(self, sim_config):
        L.debug('creating simulation')

        self.sim_config = sim_config
        self.recording_list = []
        cell_config_list = sim_config['cells']
        self.gids = sorted([cell_config['neuron']['gid'] for cell_config in cell_config_list])

        L.debug('creating bglibpy SSim instance')
        self.ssim = bglibpy.SSim(CIRCUIT_PATH)

        L.debug('instantiating ssim gids: %s', self.gids)
        self.ssim.instantiate_gids(self.gids, add_synapses=True, add_minis=True)

        for cell_config in cell_config_list:
            gid = cell_config['neuron']['gid']
            for recording in cell_config['recordings']:
                self._add_recording_section(gid, recording['sectionName'])
            for stimulus in cell_config['stimuli']:
                self._add_current_injection(gid, stimulus)

    def _add_recording_section(self, gid, sec_name):
        L.debug('adding recording section for %s in cell %s', sec_name, gid)

        sec = self._get_sec_by_name(sec_name)
        self.ssim.cells[gid].add_voltage_recording(sec, .5)
        self.recording_list.append((gid, sec))

    def _add_current_injection(self, gid, injection_config):
        sec_name = injection_config['sectionName']
        sec = self._get_sec_by_name(sec_name)
        injection_type = injection_config['type']

        if injection_type == 'step':
            L.debug('adding step current injection for %s in cell %s', sec_name, gid)

            start_time = injection_config['delay']
            stop_time = start_time + injection_config['duration']
            level = injection_config['current']
            self.ssim.cells[gid].add_step(start_time, stop_time, level, section=sec)

        elif injection_type == 'ramp':
            L.debug('adding ramp current injection for %s in cell %s', sec_name, gid)

            start_time = injection_config['delay']
            stop_time = start_time + injection_config['duration']
            start_level = injection_config['current']
            stop_level = injection_config['stopCurrent']
            self.ssim.cells[gid].add_ramp(
                start_time,
                stop_time,
                start_level,
                stop_level,
                section=sec
            )

    def run(self):
        global_sim_config = self.sim_config['globalConfig']
        t_stop = global_sim_config['tStop']
        time_step = global_sim_config['timeStep']
        L.debug('starting simulation with t_stop=%s, dt=%s', t_stop, time_step)
        self.ssim.run(t_stop=t_stop, dt=time_step)
        L.debug('simulation has been finished')

    def get_traces(self):
        L.debug('getting traces from simulation result')
        traces = {}
        for gid, sec in self.recording_list:
            if gid not in traces:
                traces[gid] = {}
            traces[gid][sec.name()] = self.ssim.cells[gid].get_voltage_recording(sec, .5)
        return traces

    def _get_sec_by_name(self, sec_name):
        return [sec for sec in bglibpy.neuron.h.allsec() if sec.name() == sec_name][0]
