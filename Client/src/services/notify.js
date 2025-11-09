// Centralized toast helpers using react-toastify
import { toast } from 'react-toastify'

export const notify = {
  success: (msg, opts={}) => toast.success(msg, { autoClose: 3000, ...opts }),
  error: (msg, opts={}) => toast.error(msg, { autoClose: 5000, ...opts }),
  info: (msg, opts={}) => toast.info(msg, { autoClose: 4000, ...opts }),
  warn: (msg, opts={}) => toast.warn(msg, { autoClose: 4000, ...opts }),
  promise: (p, { pending='Processing...', success='Done', error='Failed' }={}, opts={}) => {
    return toast.promise(p, { pending, success, error }, { autoClose: 4000, ...opts })
  }
}
