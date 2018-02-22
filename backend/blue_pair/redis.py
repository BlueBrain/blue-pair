
import os
import json

import redis


REDIS_HOST = os.getenv('REDIS_HOST')

if REDIS_HOST is not None:
    rc = redis.StrictRedis(host=REDIS_HOST)
else:
    rc = None


class RedisClient():
    def get(self, key):
        if rc is not None:
            return rc.get(key)

    def get_json_parsed(self, key):
        if rc is not None:
            raw = rc.get(key)
            if raw is not None:
                return json.loads(raw)

    def set(self, key, val):
        if rc is not None:
            rc.set(key, val)
