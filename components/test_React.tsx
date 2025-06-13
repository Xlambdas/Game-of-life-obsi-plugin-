import React from "react";
import { useApp } from "../context/appContext";

const TestComponent = () => {
  const app = useApp();

  const saveData = () => {
    app.setData("test", { done: true });
  };

  const readData = () => {
    console.log(app.getData("test"));
  };

  return (
    <div>
      <button onClick={saveData}>Save</button>
      <button onClick={readData}>Load</button>
    </div>
  );
};
