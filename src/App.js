import React from 'react';

class App extends React.Component {
  state = this.initialState;

  get initialState() {
  }

  render() {
    return(
      <React.Fragment>
      </React.Fragment>
    );
  }
}

export default hot(module)(App);