import React, { useState, useEffect } from "react";
import { Input } from "antd";

export default function MaticInput(props) {
  const [mode, setMode] = useState(props.price ? "USD" : "MATIC");
  const [display, setDisplay] = useState();
  const [value, setValue] = useState();

  const currentValue = typeof props.value !== "undefined" ? props.value : value;

  const option = title => {
    if (!props.price) return "";
    return (
      <div
        style={{ cursor: "pointer" }}
        onClick={() => {
          if (mode === "USD") {
            setMode("MATIC");
            setDisplay(currentValue);
          } else {
            setMode("USD");
            if (currentValue) {
              const usdValue = "" + (parseFloat(currentValue) * props.price).toFixed(2);
              setDisplay(usdValue);
            } else {
              setDisplay(currentValue);
            }
          }
        }}
      >
        {title}
      </div>
    );
  };

  let prefix;
  let addonAfter;
  if (mode === "USD") {
    prefix = "$";
    addonAfter = option("USD 🔀");
  } else {
    prefix = "Ξ";
    addonAfter = option("MATIC 🔀");
  }

  useEffect(
    ()=>{
      if(!currentValue){
        setDisplay("");
      }
    }
  ,[ currentValue ])

  return (
    <Input
      placeholder={props.placeholder ? props.placeholder : "amount in " + mode}
      autoFocus={props.autoFocus}
      prefix={prefix}
      value={display}
      addonAfter={addonAfter}
      onChange={async e => {
        const newValue = e.target.value;
        if (mode === "USD") {
          const possibleNewValue = parseFloat(newValue)
          if(possibleNewValue){
            const maticValue = possibleNewValue / props.price;
            setValue(maticValue);
            if (typeof props.onChange === "function") {
              props.onChange(maticValue);
            }
            setDisplay(newValue);
          }else{
            setDisplay(newValue);
          }
        } else {
          setValue(newValue);
          if (typeof props.onChange === "function") {
            props.onChange(newValue);
          }
          setDisplay(newValue);
        }
      }}
    />
  );
}
