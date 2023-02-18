import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import jdenticon from 'jdenticon';

const JdenticonWrapper = ({ value = 'test', size = '100%' }) => {
  const icon = useRef(null);
  useEffect(() => {
    jdenticon.update(icon.current, value);
  }, [value]);

  return (
    <div>
      <svg data-jdenticon-value={value} height={size} ref={icon} width={size} />
    </div>
  );
};

JdenticonWrapper.propTypes = {
  size: PropTypes.string,
  value: PropTypes.string.isRequired
};

let Jdenticon: any;

// jdenticon is not supported under nodejs and throws errors in tests
if (process.hasOwnProperty('browser')) {
  Jdenticon = ({size = '48', value = 'test'}) => (
    <JdenticonWrapper
      size={size}
      value={value} />
  );
} else {
  Jdenticon = () => (
    <div className="Jdenticon-image-placeholder"></div>
  );
}

export default Jdenticon;