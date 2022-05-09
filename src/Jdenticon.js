import React from 'react';
import JdenticonImport from 'react-jdenticon';
import JdenticonCore from 'jdenticon';

let Jdenticon;

// jdenticon is not supported under nodejs and throws errors in tests
if (process.browser) {
  Jdenticon = ({size = 48, value = 'test'}) => (
    <JdenticonImport
      size={size}
      value={value} />
  );
} else {
  Jdenticon = ({size, value}) => (
    <div className="Jdenticon-image-placeholder"></div>
  );
}

export default Jdenticon;