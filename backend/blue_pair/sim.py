
import os
import bglibpy
import numpy as np
from multiprocessing import Queue, Process


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']


def get_sim_traces(sim_config):
    q = Queue()
    p = Process(target=get_sim_traces_mp, args=(q, sim_config))
    p.start()
    traces = q.get()
    p.join()
    return traces


def get_sim_traces_mp(q, sim_config):
    sim = Sim(sim_config)
    sim.run()
    traces = sim.get_traces()
    # TODO: add progress
    q.put(traces)


class Sim(object):
    def __init__(self, sim_config):
        self.sim_config = sim_config
        self.recording_list = [];
        cell_config_list = sim_config['cells']
        self.gids = [cell_config['neuron']['gid'] for cell_config in cell_config_list]

        self.ssim = bglibpy.SSim(CIRCUIT_PATH)
        self.ssim.instantiate_gids(self.gids, add_synapses=True, add_minis=True)

        for cell_config in cell_config_list:
            gid = cell_config['neuron']['gid']
            for recording in cell_config['recordings']:
                self._add_recording_section(gid, recording['sectionName'])
            for stimulus in cell_config['stimuli']:
                self._add_current_injection(gid, stimulus)

    def _add_recording_section(self, gid, sec_name):
        sec = self._get_sec_by_name(sec_name)
        self.ssim.cells[gid].add_voltage_recording(sec, .5)
        self.recording_list.append((gid, sec))

    def _add_current_injection(self, gid, injection_config):
        sec_name = injection_config['sectionName']
        sec = self._get_sec_by_name(sec_name)
        injection_type = injection_config['type']
        if injection_type == 'step':
            start_time = injection_config['delay']
            stop_time = start_time + injection_config['duration']
            level = injection_config['current']
            self.ssim.cells[gid].add_step(start_time, stop_time, level, section=sec)

    def run(self):
        # TODO: use real values sent by client
        self.ssim.run(t_stop=200, dt=0.025)

    def get_traces(self):
        traces = {}
        for gid, sec in self.recording_list:
            if gid not in traces:
                traces[gid] = {}
            traces[gid][sec.name()] = self.ssim.cells[gid].get_voltage_recording(sec, .5)
        return traces

    def _get_sec_by_name(self, sec_name):
        return [sec for sec in bglibpy.neuron.h.allsec() if sec.name() == sec_name][0]
