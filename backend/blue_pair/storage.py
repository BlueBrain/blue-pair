
import os
import logging
import time

from multiprocessing import Process, Queue
from itertools import combinations

import bluepy
import pandas as pd
import numpy as np
import bglibpy

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
            cells = circuit.v2.cells.get().drop(['orientation', 'synapse_class'], 1, errors='ignore');
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
            Synapse.TYPE,
            Synapse.PRE_GID,
            Synapse.PRE_SECTION_ID,
            Synapse.POST_GID,
            Synapse.POST_SECTION_ID
        ]

        props_str = [
            'postXCenter',
            'postYCenter',
            'postZCenter',
            'type',
            'preGid',
            'preSectionGid',
            'postGid',
            'postSectionId'
        ]

        syn_dict = {}

        for gid in gids:
            syn_dict[gid] = circuit.v2.connectome.afferent_synapses(gid, properties=props).values.tolist()

        L.debug('getting syn connections for %s done', gids)

        return {
            'connections': syn_dict,
            'connection_properties': props_str
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

    def get_cell_nm_morphology(self, gids):
        L.debug('getting axon cell morph from neurom for %s', gids)
        cells = {}
        for gid in gids:
            cell_morph = cache.get('cell:morph:{}'.format(gid))
            if cell_morph is None:
                cell = circuit.v2.morph.get(gid, transform=True)
                morphology = {
                    'axon': [section.points for section in cell.sections if section.type.name == 'axon']
                }
                cache.set('cell:morph:{}'.format(gid), morphology)
                cells[gid] = morphology
        L.debug('getting axon cell morph from neurom for %s done', gids)
        return {'cells': cells}

def get_cell_morphology_mp(mp_queue, gids):
    L.debug('creating bglibpy SSim object')
    ssim = bglibpy.SSim(CIRCUIT_PATH)
    L.debug('instantiating ssim gids: %s', gids)
    ssim.instantiate_gids(sorted(gids))
    L.debug('getting cell morphologies')
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
