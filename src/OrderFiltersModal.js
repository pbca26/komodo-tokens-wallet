import React, {useState, useEffect} from 'react';
import Modal from './Modal';
import {orderType, orderDirection} from './constants';

const OrderFiltersModal = props => {
  const [isClosed, setIsClosed] = useState(true);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  
  const dropdownEventHandler = (e, index) => {
    e.stopPropagation();

    setTokenDropdownOpen(index === tokenDropdownOpen ? false : index);
  };

  useEffect(() => {
    document.addEventListener(
      'click',
      clickOutsideHandler,
      false
    );

    return () => {
      document.removeEventListener(
        'click',
        clickOutsideHandler,
        false
      );
    };
  }, []);

  const clickOutsideHandler = e => {
    setTokenDropdownOpen(false);
  };

  return (
    <React.Fragment>
      <div onClick={() => setIsClosed(false)}>
        {props.children}
      </div>
      <Modal
        title="Order Filters"
        show={isClosed === false}
        handleClose={() => setIsClosed(true)}
        isCloseable={true}
        className="Order-filters-modal">
        <React.Fragment>
          <h4>Order filters</h4>
          <div className={`dropdown${tokenDropdownOpen === 2 ? ' is-active' : ''}`}>
            <div className="dropdown-trigger">
              <button
                className="button"
                onClick={(e) => dropdownEventHandler(e, 2)}>
                <span>{orderDirection.filter(x => x.value === props.filtersDirection)[0].title}</span>
                <span className="icon is-small">
                  <i className="fas fa-angle-down"></i>
                </span>
              </button>
            </div>
            <div
              className="dropdown-menu"
              id="dropdown-menu"
              role="menu">
              <div className="dropdown-content">
                {orderDirection.map(orderDirectionItem => (
                  <a
                    key={`order-filter-direction-${orderDirectionItem.value}`}
                    className="dropdown-item"
                    onClick={() => props.setFilter('filtersDirection', orderDirectionItem.value)}>
                    <span className="dropdown-balance">{orderDirectionItem.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className={`dropdown${tokenDropdownOpen === 1 ? ' is-active' : ''}`}>
            <div className="dropdown-trigger">
              <button
                className="button"
                onClick={(e) => dropdownEventHandler(e, 1)}>
                <span>{orderType.filter(x => x.value === props.filtersType)[0].title}</span>
                <span className="icon is-small">
                  <i className="fas fa-angle-down"></i>
                </span>
              </button>
            </div>
            <div
              className="dropdown-menu"
              id="dropdown-menu"
              role="menu">
              <div className="dropdown-content">
                {orderType.map(orderTypeItem => (
                  <a
                    key={`order-filter-type-${orderTypeItem.value}`}
                    className="dropdown-item"
                    onClick={() => props.setFilter('filtersType', orderTypeItem.value)}>
                    <span className="dropdown-balance">{orderTypeItem.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </React.Fragment>
      </Modal>
    </React.Fragment>
  );
}

export default OrderFiltersModal;