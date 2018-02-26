
import os
import json

import tornado.ioloop
import tornado.web
import tornado.websocket

from blue_pair.storage import Storage
from blue_pair.utils import NumpyAwareJSONEncoder

storage = Storage()


class WSHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def on_message(self, msg):
        msg = json.loads(msg)
        cmd = msg['cmd']
        cmdid = msg['cmdid']

        if cmd == 'get_circuit_cells':
            cells = storage.get_circuit_cells()
            cells['cmdid'] = cmdid
            self.send_message('circuit_cells', cells)

        elif cmd == 'get_cell_connectome':
            gid = msg['data']
            connectome = storage.get_connectome(gid)
            connectome['cmdid'] = cmdid
            self.send_message('cell_connectome', connectome)

        elif cmd == 'get_syn_connections':
            gids = msg['data']
            connections = storage.get_syn_connections(gids)
            connections['cmdid'] = cmdid
            self.send_message('syn_connections', connections)

        elif cmd == 'get_cell_morphology':
            gids = msg['data']
            cell_morph = storage.get_cell_morphology(gids)
            cell_morph['cmdid'] = cmdid
            self.send_message('cell_morphology', cell_morph)

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
