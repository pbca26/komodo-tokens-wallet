import React from 'react';
import Modal from './Modal';
import writeLog from './log';

class MetaConverterModal extends React.Component {
  state = this.initialState;
  
  get initialState() {
    this.updateInput = this.updateInput.bind(this);
    this.formatMeta = this.formatMeta.bind(this);
    
    return {
      isClosed: true,
      error: null,
      data: '',
      convertedMeta: '',
      royalty: '',
      id: '',
    };
  }

  updateInput(e) {
    this.setState({
      error: null,
      convertedMeta: null,
      [e.target.name]: e.target.value,
    });

    writeLog('login this.state', this.state);
  }

  close() {
    this.setState({
      ...this.initialState,
      isClosed: true,
    });
  }

  open() {
    this.setState({
      ...this.initialState,
      isClosed: false,
    });
  }

  formatMeta() {
    let outMetaJson;

    const toTokelFormat = (metaJson, i) => {
      const _data = {
        name: metaJson.name,
        description: metaJson.description,
        supply: 1,
        nft: {
          url: metaJson.image,
          arbitrary: metaJson.attributes,
        },
      }

      if (Number(this.state.royalty) > 0) {
        _data.nft.royalty = Number(this.state.royalty);
      }

      if (Number(this.state.id) > 0) {
        _data.nft.id = Number(this.state.id) + i;
      }

      _data.nft = JSON.stringify(_data.nft);

      return _data;
    }

    try {
      const metaJson = JSON.parse(this.state.meta);

      writeLog(metaJson);
      if (Array.isArray(metaJson)) {
        outMetaJson = [];

        for (let i = 0; i < metaJson.length; i++) {
          outMetaJson.push(toTokelFormat(metaJson[i], i));
        }

        writeLog('out json array', outMetaJson);
      } else {
        outMetaJson = toTokelFormat(metaJson, 0);
        writeLog('out json obj', outMetaJson);
      }

      this.setState({
        convertedMeta: JSON.stringify(outMetaJson, null, 2),
      });
    } catch (e) {
      writeLog(e);
      this.setState({
        success: null,
        error: 'Unable to parse JSON meta input data',
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <div
          className="token-tile create-new-trigger"
          onClick={() => this.open()}>
          <i className="fa fa-adjust"></i>
          Meta Converter
        </div>
        <Modal
          show={this.state.isClosed === false}
          handleClose={() => this.close()}
          isCloseable={true}
          className="Modal-create-token">
          <div className="create-token-form">
            <h4>Meta Converter</h4>
            <p>Provide meta data in the form below</p>
            <div className="input-form">
              <input
                type="text"
                name="royalty"
                placeholder="Royalty (number 1-999)"
                value={this.state.royalty}
                onChange={this.updateInput} />
              <input
                type="text"
                name="id"
                placeholder="ID (number to start incrementing from)"
                value={this.state.id}
                onChange={this.updateInput} />
              <textarea
                rows="5"
                cols="33"
                name="meta"
                placeholder="Place meta data here"
                value={this.state.meta}
                onChange={this.updateInput}>
              </textarea>
              <button
                type="button"
                onClick={this.formatMeta}
                disabled={!this.state.meta}>Convert</button>
              {this.state.convertedMeta &&
                <textarea
                  rows="5"
                  cols="33"
                  name="convertedMeta"
                  placeholder="Converted meta"
                  value={this.state.convertedMeta}>
                </textarea>
              }
              {this.state.error &&
                <div className="error">
                  <div>
                    <strong>Error!</strong>
                    <div>{this.state.error}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default MetaConverterModal;
