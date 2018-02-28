
import os

import bluepy
import pandas as pd
import neurom as nm
import numpy as np
import bglibpy

from bluepy.v2.enums import Synapse

from blue_pair.cell import Cell
from voxcell.quaternion import matrices_to_quaternions
from blue_pair.redis_client import RedisClient


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']
circuit = bluepy.Circuit(CIRCUIT_PATH)
cache = RedisClient()


class Storage():
    def get_circuit_cells(self):
        cells = cache.get_json_parsed('circuit:cells')
        if cells is None:
            cellsList = circuit.v2.cells.get().to_dict(orient="split")
            cells = {
                'properties': cells['columns'],
                'data': cells['data']
            }
            cache.set('circuit:cells', cells)
        return cells

    def get_connectome(self, gid):
        connectome = cache.get_json_parsed('circuit:connectome:{}'.format(gid))
        if connectome is None:
            connectome = {
                'afferent': circuit.v2.connectome.afferent_gids(gid),
                'efferent': circuit.v2.connectome.efferent_gids(gid)
            }
            cache.set('circuit:connectome:{}'.format(gid), connectome)
        return connectome

    def get_syn_connections(self, gids):
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

        return {
            'connections': connections
        }

    def get_cell_morphology(self, gids):
        cells = {}
        not_cached_gids = []
        for gid in gids:
            cell_morph = cache.get_json_parsed('cell:morph:{}'.format(gid))
            if cell_morph is None:
                not_cached_gids.append(gid)
        if len(not_cached_gids) > 0:
            ssim = bglibpy.SSim(CIRCUIT_PATH)
            ssim.instantiate_gids(gids)
            for gid in not_cached_gids:
                cell = Cell(ssim, gid)
                cells[gid] = {
                    'morph': cell.get_cell_morph(),
                    'quaternion': matrices_to_quaternions(circuit.v2.cells.get(gid)['orientation'])
                }
                cache.set('cell:morph:{}'.format(gid), cells[gid])
        return {'cells': cells}
