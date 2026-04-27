import React from "react";
import { motion } from "framer-motion";

export default function PageTransition({ children, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 25, scale: 0.98, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(8px)" }}
      transition={{ 
        duration: 0.65, 
        ease: [0.22, 1, 0.36, 1] // Premium smooth spring/cubic-bezier easing
      }}
    >
      {children}
    </motion.div>
  );
}