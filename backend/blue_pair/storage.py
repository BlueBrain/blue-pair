
import os
import logging

import bluepy
import pandas as pd
import neurom as nm
import numpy as np
import bglibpy
from multiprocessing import Process, Queue

from bluepy.v2.enums import Synapse

from blue_pair.cell import Cell
from voxcell.quaternion import matrices_to_quaternions
from blue_pair.redis_client import RedisClient

l = logging.getLogger(__name__)
l.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']
l.debug('creating bluepy circuit from {}'.format(CIRCUIT_PATH))
circuit = bluepy.Circuit(CIRCUIT_PATH)
l.debug('bluepy circuit has been created')

l.debug('creating cache client')
cache = RedisClient()
l.debug('cache client has been created')


class Storage():
    def get_circuit_cells(self):
        l.debug('getting cells')
        cells = cache.get('circuit:cells')
        if cells is None:
            cellsList = circuit.v2.cells.get().to_dict(orient="split")
            cells = {
                'properties': cellsList['columns'],
                'data': cellsList['data']
            }
            cache.set('circuit:cells', cells)
        l.debug('getting cells done')
        return cells

    def get_connectome(self, gid):
        l.debug('getting connectome for {}'.format(gid))
        connectome = cache.get('circuit:connectome:{}'.format(gid))
        if connectome is None:
            connectome = {
                'afferent': circuit.v2.connectome.afferent_gids(gid),
                'efferent': circuit.v2.connectome.efferent_gids(gid)
            }
            cache.set('circuit:connectome:{}'.format(gid), connectome)
        l.debug('getting connectome for {} done'.format(gid))
        return connectome

    def get_syn_connections(self, gids):
        l.debug('getting syn connections for {}'.format(gids))
        props = [
            Synapse.POST_X_CENTER,
            Synapse.POST_Y_CENTER,
            Synapse.POST_Z_CENTER,
            Synapse.POST_GID,
            Synapse.POST_SECTION_ID
        ]

        connections = np.array(pd.concat([
            circuit.v2.connectome.pair_synapses(gids[0], gids[1], properties=props),
            circuit.v2.connectome.pair_synapses(gids[1], gids[0], properties=props)
        ]))

        l.debug('getting syn connections for {} done'.format(gids))
        return {
            'connections': connections
        }

    def get_cell_morphology(self, gids):
        l.debug('getting cell morph for {}'.format(gids))
        cells = {}
        not_cached_gids = []
        for gid in gids:
            cell_morph = cache.get('cell:morph:{}'.format(gid))
            if cell_morph is None:
                not_cached_gids.append(gid)
        if len(not_cached_gids) > 0:
            q = Queue()
            p = Process(target=get_cell_morphology_mp, args=(q, not_cached_gids))
            p.start()
            not_cached_cells = q.get()
            p.join()
            for (gid, morph_dict) in not_cached_cells:
                cells[gid] = morph_dict
                cache.set('cell:morph:{}'.format(gid), cells[gid])
        l.debug('getting cell morph for {} done'.format(gids))
        return {'cells': cells}

def get_cell_morphology_mp(q, gids):
    ssim = bglibpy.SSim(CIRCUIT_PATH)
    ssim.instantiate_gids(gids)
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
    q.put(morphologies)
