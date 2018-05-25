
import os
import logging

from multiprocessing import Queue, Process

import bglibpy
import numpy as np

global custom_progress_cb
def default_progress_cb():
    print('default cb')
    pass

custom_progress_cb = default_progress_cb


def progress_callback(self):
        custom_progress_cb()
        bglibpy.neuron.h.cvode.event(bglibpy.neuron.h.t + self.progress_dt, self.progress_callback)

bglibpy.Simulation.progress_callback = progress_callback


L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']



def get_sim_traces(sim_config, progress_cb):
    mp_queue = Queue()
    mp_process = Process(target=get_sim_traces_mp, args=(mp_queue, sim_config, progress_cb))
    mp_process.start()
    traces = mp_queue.get()
    mp_process.join()
    return traces


def get_sim_traces_mp(mp_queue, sim_config, progress_cb):
    def progress():
        progress_cb(sim.get_traces())

    sim = Sim(sim_config, progress)
    sim.run()
    traces = sim.get_traces()
    # TODO: add progress
    mp_queue.put(traces)


class Sim(object):
    def __init__(self, sim_config, progress_cb):
        L.debug('creating simulation')

        global custom_progress_cb

        self.net_connections = []
        self.sim_config = sim_config
        self.recording_list = []
        self.gids = sorted(sim_config['gids'])

        custom_progress_cb = progress_cb

        L.debug('creating bglibpy SSim instance')
        self.ssim = bglibpy.SSim(CIRCUIT_PATH)

        L.debug('instantiating ssim gids: %s', self.gids)
        self.ssim.instantiate_gids(self.gids, add_synapses=True, add_minis=True)

        for recording in sim_config['recordings']:
            self._add_recording_section(recording)

        for stimulus in sim_config['stimuli']:
            self._add_current_injection(stimulus)

        for pre_gid in sim_config['synapses']:
            pre_spiketrain_frequency = sim_config['synapses'][pre_gid]['spikeFrequency']
            L.debug('generating pre_spiketrain for pre_gid %s with frequency %s Hz', pre_gid, pre_spiketrain_frequency)
            pre_spiketrain = self.generate_pre_spiketrain(pre_spiketrain_frequency)
            L.debug('generated pre_spiketrain: %s', pre_spiketrain)

            synapse_description_list = sim_config['synapses'][pre_gid]['synapses']
            for synapse_description in synapse_description_list:
                self._add_syn_input(synapse_description, pre_spiketrain)

    def _add_syn_input(self, synapse_description, pre_spiketrain):
        post_gid = synapse_description['postGid']
        syn_index = synapse_description['index']
        L.debug('adding pre_spiketrain to synapse (%s, %s)', post_gid, syn_index)
        synapse = self.ssim.cells[post_gid].synapses[syn_index]
        connection = bglibpy.Connection(synapse, pre_spiketrain=pre_spiketrain)
        self.net_connections.append(connection)

    def _add_recording_section(self, recording):
        gid = recording['gid']
        sec_name = recording['sectionName']
        L.debug('adding recording section for %s in cell %s', sec_name, gid)

        sec = self._get_sec_by_name(gid, sec_name)
        self.ssim.cells[gid].add_voltage_recording(sec, .5)
        self.recording_list.append((gid, sec))

    def _add_current_injection(self, injection_config):
        gid = injection_config['gid']
        sec_name = injection_config['sectionName']
        sec = self._get_sec_by_name(gid, sec_name)
        injection_type = injection_config['type']

        # TODO: consistent variable naming
        if injection_type == 'step':
            L.debug('adding step current injection for %s in cell %s', sec_name, gid)

            start_time = injection_config['delay']
            stop_time = start_time + injection_config['duration']
            level = injection_config['current']

            L.debug('delay: %s, duration: %s, amp: %s',
                    start_time,
                    stop_time,
                    level)

            self.ssim.cells[gid].add_step(start_time, stop_time, level, section=sec)

        elif injection_type == 'ramp':
            L.debug('adding ramp current injection for %s in cell %s', sec_name, gid)

            start_time = injection_config['delay']
            sim_duration = injection_config['duration']
            stop_time = start_time + sim_duration
            start_level = injection_config['current']
            stop_level = injection_config['stopCurrent']

            L.debug('delay: %s, duraton: %s, startAmp: %s, stopAmp: %s',
                    start_time,
                    sim_duration,
                    start_level,
                    stop_level)

            self.ssim.cells[gid].add_ramp(
                start_time,
                stop_time,
                start_level,
                stop_level,
                section=sec
            )

        elif injection_type == 'pulse':
            L.debug('adding pulse injection for cell %s', gid)
            L.debug('delay: %s, duration: %s, amp: %s, frequency: %s, width: %s',
                    injection_config['delay'],
                    injection_config['duration'],
                    injection_config['current'],
                    injection_config['frequency'],
                    injection_config['width'])

            bglibpy_pulse_config = {
                'Delay': injection_config['delay'],
                'Duration': injection_config['duration'],
                'AmpStart': injection_config['current'],
                'Frequency': injection_config['frequency'],
                'Width': injection_config['width']
            }

            print(bglibpy_pulse_config)

            self.ssim.cells[gid].add_pulse(bglibpy_pulse_config);

    def generate_pre_spiketrain(self, frequency, start_offset=0):
        spike_interval = 1000 / frequency
        spiketrain_size = int(round(float(self.sim_config['tStop']) / 1000 * frequency))
        return np.cumsum(np.random.poisson(spike_interval, spiketrain_size)) + start_offset

    def run(self):
        t_stop = self.sim_config['tStop']
        time_step = self.sim_config['timeStep']
        forward_skip = self.sim_config['forwardSkip'] if self.sim_config['forwardSkip'] > 0 else None
        L.debug('starting simulation with t_stop=%s, dt=%s, forward_skip=%s', t_stop, time_step, forward_skip)
        self.ssim.run(t_stop=t_stop, dt=time_step, show_progress=True, forward_skip_value=forward_skip)
        L.debug('simulation has been finished')

    def get_traces(self):
        L.debug('getting traces from simulation result')
        traces = {}
        for gid, sec in self.recording_list:
            if gid not in traces:
                traces[gid] = {'voltage': {}}
            traces[gid]['voltage'][sec.name()] = self.ssim.cells[gid].get_voltage_recording(sec, .5)
            traces[gid]['time'] = self.ssim.cells[gid].get_time()
        return traces

    def _get_sec_by_name(self, gid, sec_name):
        sec_full_name = '%s.%s' % (self.ssim.cells[gid].cell.hname(), sec_name)
        return [sec for sec in bglibpy.neuron.h.allsec() if sec.name() == sec_full_name][0]
