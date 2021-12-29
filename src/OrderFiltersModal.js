import React from 'react';
import Modal from './Modal';
import {orderType, orderDirection} from './constants';

class OrderFiltersModal extends React.Component {
  state = this.initialState;

  get initialState() {
    this.dropdownTrigger = this.dropdownTrigger.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);

    return {
      isClosed: true,
      tokenDropdownOpen: false,
    };
  }

  close() {
    this.setState({
      isClosed: true
    });
  }

  open() {
    this.setState({
      isClosed: false
    });
  }

  dropdownTrigger(e, index) {
    e.stopPropagation();

    this.setState({
      tokenDropdownOpen: index === this.state.tokenDropdownOpen ? false : index,
    });
  }

  componentWillMount() {
    document.addEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  componentWillUnmount() {
    document.removeEventListener(
      'click',
      this.handleClickOutside,
      false
    );
  }

  handleClickOutside(e) {
    this.setState({
      tokenDropdownOpen: false,
    });
  }

  render() {
    const {chain} = this.props;

    return (
      <React.Fragment>
        <div onClick={() => this.open()}>
          {this.props.children}
        </div>
        <Modal
          title="Order Filters"
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Order-filters-modal">
          <React.Fragment>
            <h4>Order filters</h4>
            <div className={`dropdown${this.state.tokenDropdownOpen === 2 ? ' is-active' : ''}`}>
              <div className={`dropdown-trigger${this.state.token ? ' highlight' : ''}`}>
                <button
                  className="button"
                  onClick={(e) => this.dropdownTrigger(e, 2)}>
                  <span>{orderDirection.filter(x => x.value === this.props.filtersDirection)[0].title}</span>
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
                      onClick={() => this.props.setFilter('filtersDirection', orderDirectionItem.value)}>
                      <span className="dropdown-balance">{orderDirectionItem.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className={`dropdown${this.state.tokenDropdownOpen === 1 ? ' is-active' : ''}`}>
              <div className={`dropdown-trigger${this.state.token ? ' highlight' : ''}`}>
                <button
                  className="button"
                  onClick={(e) => this.dropdownTrigger(e, 1)}>
                   <span>{orderType.filter(x => x.value === this.props.filtersType)[0].title}</span>
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
                      onClick={() => this.props.setFilter('filtersType', orderTypeItem.value)}>
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
}

export default OrderFiltersModal;