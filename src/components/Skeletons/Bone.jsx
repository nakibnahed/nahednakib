import s from "./Bone.module.css";

export default function Bone({ style, className }) {
  return <div className={`${s.bone}${className ? ` ${className}` : ""}`} style={style} />;
}
