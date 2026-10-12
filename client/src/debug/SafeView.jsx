import { Component } from "react";

// If drawing the step-through view ever throws, show a short message and a way out instead of a blank page.
export class SafeView extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error("step-through view failed:", error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="callout bad" role="alert" style={{ margin: 14 }}>
        Something went wrong while showing this run. Your code is safe.
        <div style={{ marginTop: 8 }}><button className="btn" onClick={this.props.onExit}>Back to editing</button></div>
      </div>
    );
  }
}
