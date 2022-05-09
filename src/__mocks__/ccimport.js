// IMPORTANT: cclib must be compiled with nodejs target
//            otherwise Jest won't be able to load it
import * as ccimp from '../../cryptoconditions-js-tests/pkg/cryptoconditions.js';
window.ccimp = ccimp;