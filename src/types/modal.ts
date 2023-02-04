export type ModalProps = {
  title?: string,
  show: boolean,
  children?: JSX.Element,
  isCloseable: boolean,
  handleClose: Function,
  className: string,
};