
import os
import logging

import bluepy

from bluepy.v2.enums import Synapse

from blue_pair.redis_client import RedisClient
from blue_pair.utils import matrices_to_quaternions

L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']
L.debug('creating bluepy circuit from %s', CIRCUIT_PATH)
CIRCUIT = bluepy.Circuit(CIRCUIT_PATH)
L.debug('bluepy circuit has been created')

L.debug('creating cache client')
cache = RedisClient()
L.debug('cache client has been created')

SEC_SHORT_TYPE_DICT = {
    'soma': 'soma',
    'basal_dendrite': 'dend',
    'apical_dendrite': 'apic',
    'axon': 'axon'
}


class Storage():
    def get_circuit_cells(self):
        L.debug('getting cells')
        cells = cache.get('circuit:cells')
        if cells is None:
            cells = CIRCUIT.v2.cells.get().drop(['orientation', 'synapse_class'], 1, errors='ignore');
            cache.set('circuit:cells', cells)
        L.debug('getting cells done')
        return cells

    def get_connectome(self, gid):
        L.debug('getting connectome for %s', gid)
        connectome = cache.get('circuit:connectome:{}'.format(gid))
        if connectome is None:
            connectome = {
                'afferent': CIRCUIT.v2.connectome.afferent_gids(gid),
                'efferent': CIRCUIT.v2.connectome.efferent_gids(gid)
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
            L.debug('getting afferent synapses for %s', gid)
            syn_dict[gid] = CIRCUIT.v2.connectome.afferent_synapses(gid, properties=props).values.tolist()

        L.debug('getting syn connections for %s done', gids)

        return {
            'connections': syn_dict,
            'connection_properties': props_str
        }

    def get_cell_morphology(self, gids):
        L.debug('getting cell morph for %s', gids)
        cells = {}
        for gid in gids:
            cell_morph = cache.get('cell:morph:{}'.format(gid))
            if cell_morph is None:
                cell = CIRCUIT.v2.morph.get(gid, transform=True)
                morphology = [
                    {
                        'points': [point[:4] for point in section.points],
                        'id': section.id,
                        'type': SEC_SHORT_TYPE_DICT[section.type.name]
                    }
                    for section in cell.sections]

                cache.set('cell:morph:{}'.format(gid), morphology)

                orientation = CIRCUIT.v2.cells.get(gid)['orientation']
                cell_quaternion = matrices_to_quaternions(orientation)

                cells[gid] = {
                    'sections': morphology,
                    'quaternion': cell_quaternion
                }
        L.debug('getting cell morph for %s done', gids)
        return {'cells': cells}
