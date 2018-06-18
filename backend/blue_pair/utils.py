
import json
import numpy as np


class NumpyAwareJSONEncoder(json.JSONEncoder):
    '''JSON encode numpy instances'''
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

# TODO: switch to using numpy-quaternion lib
def matrices_to_quaternions(matrices):
    '''build quaternions from an array of 3x3 rotation matrices

    Based on multibranch algorithm described here:
    http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

    Args:
        matrices: A Nx3x3 numpy array containing N rotation matrices.

    Returns:
        A Nx4 numpy array containing a unit quaternion for each rotation matrix.
        The quaternion components are stored as (x, y, z, w)
    '''

    # this is the same algorithm used internally by THREE.js

    quat = np.zeros(shape=matrices.shape[:-2] + (4,), dtype=np.float)

    # using boolean array "mask" to simulate the branching
    # the boolean array "done" allows us to do the equivalent of "else"
    done = np.zeros(shape=matrices.shape[:-2], dtype=np.bool)

    # branch 1

    trace = np.trace(matrices, axis1=-2, axis2=-1)
    mask = trace > 0
    done |= mask
    m = matrices[mask]

    s = 0.5 / np.sqrt(trace[mask] + 1.0)
    x = (m[..., 2, 1] - m[..., 1, 2]) * s
    y = (m[..., 0, 2] - m[..., 2, 0]) * s
    z = (m[..., 1, 0] - m[..., 0, 1]) * s
    w = 0.25 / s
    quat[mask] = np.array([x, y, z, w]).transpose()

    # branch 2

    mask = (~done &
            (matrices[..., 0, 0] > matrices[..., 1, 1]) &
            (matrices[..., 0, 0] > matrices[..., 2, 2]))
    done |= mask
    m = matrices[mask]

    s = 2.0 * np.sqrt(1.0 + m[..., 0, 0] - m[..., 1, 1] - m[..., 2, 2])
    x = 0.25 * s
    y = (m[..., 0, 1] + m[..., 1, 0]) / s
    z = (m[..., 0, 2] + m[..., 2, 0]) / s
    w = (m[..., 2, 1] - m[..., 1, 2]) / s
    quat[mask] = np.array([x, y, z, w]).transpose()

    # branch 3

    mask = ~done & (matrices[..., 1, 1] > matrices[..., 2, 2])
    done |= mask
    m = matrices[mask]

    s = 2.0 * np.sqrt(1.0 + m[..., 1, 1] - m[..., 0, 0] - m[..., 2, 2])
    x = (m[..., 0, 1] + m[..., 1, 0]) / s
    y = 0.25 * s
    z = (m[..., 1, 2] + m[..., 2, 1]) / s
    w = (m[..., 0, 2] - m[..., 2, 0]) / s
    quat[mask] = np.array([x, y, z, w]).transpose()

    # branch 4

    mask = ~done
    m = matrices[mask]

    s = 2.0 * np.sqrt(1.0 + m[..., 2, 2] - m[..., 0, 0] - m[..., 1, 1])
    x = (m[..., 0, 2] + m[..., 2, 0]) / s
    y = (m[..., 1, 2] + m[..., 2, 1]) / s
    z = 0.25 * s
    w = (m[..., 1, 0] - m[..., 0, 1]) / s
    quat[mask] = np.array([x, y, z, w]).transpose()

    return quat / np.sqrt((quat ** 2).sum(-1))[..., np.newaxis]
