
import tornado.ioloop
import tornado.web
import tornado.websocket
import json
import bluepy
import os
import pandas as pd
import neurom as nm
import numpy as np
import bglibpy

from blue_pair.cell import Cell
from blue_pair.utils import NumpyAwareJSONEncoder
from voxcell.quaternion import matrices_to_quaternions


CIRCUIT_PATH = os.environ['CIRCUIT_PATH']
circuit = bluepy.Circuit(CIRCUIT_PATH)


class WSHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def on_message(self, msg):
        msg = json.loads(msg)
        cmd = msg['cmd']
        cmdid = msg['cmdid']

        if cmd == 'get_neurons':
            # TODO add logic to remove complex properties
            cells = circuit.v2.cells.get().to_dict(orient="split")

            self.send_message('neurons', {
                'columns': cells['columns'],
                'data': cells['data'],
                'cmdid': cmdid
            })

        elif cmd == 'get_connectome':
            gid = msg['data']
            afferent = circuit.v2.connectome.afferent_gids(gid)
            efferent = circuit.v2.connectome.efferent_gids(gid)
            self.send_message('connectome', {
                'afferent': afferent,
                'efferent': efferent,
                'cmdid': cmdid
            })

        elif cmd == 'get_morphology':
            # TODO: add redis caching
            gids = msg['data']
            ssim = bglibpy.SSim(circuit_path)
            ssim.instantiate_gids(gids)
            cells = {}
            for gid in gids:
                cell = Cell(ssim, gid)
                cells[gid] = {
                    'morph': cell.get_cell_morph(),
                    'quaternion': matrices_to_quaternions(circuit.v2.cells.get(gid)['orientation'])
                }
            self.send_message('morphology', {
                'cells': cells,
                'cmdid': cmdid
            })

    def send_message(self, cmd, data=None):
        payload = json.dumps({'cmd': cmd, 'data': data},
                             cls=NumpyAwareJSONEncoder)
        self.write_message(payload)


if __name__ == '__main__':
    app = tornado.web.Application([
        (r'/ws', WSHandler),
    ])
    app.listen(8000)
    tornado.ioloop.IOLoop.current().start()
