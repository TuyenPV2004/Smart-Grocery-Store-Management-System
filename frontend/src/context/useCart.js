import { useContext } from "react";
import { CartContext } from "./CartContextValue";

export const useCart = () => useContext(CartContext);
