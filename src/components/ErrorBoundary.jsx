import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    // You can log error here
  }
  render() {
    if (this.state.hasError) {
      return <div className="alert alert-danger">Something went wrong rendering the map.</div>;
    }
    return this.props.children;
  }
}
