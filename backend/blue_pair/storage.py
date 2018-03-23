
import os
import logging

import bluepy
import pandas as pd
import numpy as np
import bglibpy
from multiprocessing import Process, Queue

from bluepy.v2.enums import Synapse

from blue_pair.cell import Cell
from voxcell.quaternion import matrices_to_quaternions
from blue_pair.redis_client import RedisClient

L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']
L.debug('creating bluepy circuit from %s', CIRCUIT_PATH)
circuit = bluepy.Circuit(CIRCUIT_PATH)
L.debug('bluepy circuit has been created')

L.debug('creating cache client')
cache = RedisClient()
L.debug('cache client has been created')


class Storage():
    def get_circuit_cells(self):
        L.debug('getting cells')
        cells = cache.get('circuit:cells')
        if cells is None:
            cell_list = circuit.v2.cells.get().to_dict(orient="split")
            cells = {
                'properties': cell_list['columns'],
                'data': cell_list['data']
            }
            cache.set('circuit:cells', cells)
        L.debug('getting cells done')
        return cells

    def get_connectome(self, gid):
        L.debug('getting connectome for %s', gid)
        connectome = cache.get('circuit:connectome:{}'.format(gid))
        if connectome is None:
            connectome = {
                'afferent': circuit.v2.connectome.afferent_gids(gid),
                'efferent': circuit.v2.connectome.efferent_gids(gid)
            }
            cache.set('circuit:connectome:{}'.format(gid), connectome)
        L.debug('getting connectome for %s done', gid)
        return connectome

    def get_syn_connections(self, gids):
        L.debug('getting syn connections for %s', gids)
        props = [
            Synapse.POST_X_CENTER,
            Synapse.POST_Y_CENTER,
            Synapse.POST_Z_CENTER,
            Synapse.POST_GID,
            Synapse.POST_SECTION_ID
        ]

        # connections = np.array(pd.concat([
        #     circuit.v2.connectome.afferent_synapses(gid, properties=props) for gid in gids
        # ]))

        connections = np.array(pd.concat([
            circuit.v2.connectome.pair_synapses(gids[0], gids[1], properties=props),
            circuit.v2.connectome.pair_synapses(gids[1], gids[0], properties=props)
        ]))

        L.debug('getting syn connections for %s done', gids)
        return {
            'connections': connections
        }

    def get_cell_morphology(self, gids):
        L.debug('getting cell morph for %s', gids)
        cells = {}
        not_cached_gids = []
        for gid in gids:
            cell_morph = cache.get('cell:morph:{}'.format(gid))
            if cell_morph is None:
                not_cached_gids.append(gid)
        if len(not_cached_gids) > 0:
            mp_queue = Queue()
            mp_process = Process(target=get_cell_morphology_mp, args=(mp_queue, not_cached_gids))
            mp_process.start()
            not_cached_cells = mp_queue.get()
            mp_process.join()
            for (gid, morph_dict) in not_cached_cells:
                cells[gid] = morph_dict
                cache.set('cell:morph:{}'.format(gid), cells[gid])
        L.debug('getting cell morph for %s done', gids)
        return {'cells': cells}

def get_cell_morphology_mp(mp_queue, gids):
    ssim = bglibpy.SSim(CIRCUIT_PATH)
    ssim.instantiate_gids(sorted(gids))
    morphologies = []
    for gid in gids:
        cell = Cell(ssim, gid)
        morphologies.append((
            gid,
            {
                'morph': cell.get_cell_morph(),
                'quaternion': matrices_to_quaternions(circuit.v2.cells.get(gid)['orientation'])
            }
        ))
    mp_queue.put(morphologies)
