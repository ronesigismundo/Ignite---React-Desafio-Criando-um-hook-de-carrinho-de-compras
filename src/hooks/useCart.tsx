import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
  const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
     return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {    
    try {

    const responseStock = await api.get(`/stock/${productId}`);
    const productAmountInStock = responseStock.data.amount;
    
    // add or update if product not in or in cart
    const productInCart = cart.find(
      product => product.id === productId
    );
    if (productInCart) {
      // check if product in stock
      
      if (productAmountInStock < productInCart.amount + 1) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      updateProductAmount({
        productId, 
        amount: productInCart.amount + 1
      });
    } else {
      const responseProduct = await api.get(`/products/${productId}`);
      const product = responseProduct.data;
      if (productAmountInStock < 1) {
        toast.error('Quantidade solicitada fora de estoque')
        return;          
      }

      const updatedCart = [...cart, {...product, amount: 1}];
      setCart(updatedCart);
      localStorage.setItem(
        '@RocketShoes:cart',
        JSON.stringify(updatedCart)
      );
    }
    } catch (error) {
      // TODO
      toast.error("Erro na adição do produto")
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO;
      const product = cart.find(cart => cart.id === productId)
      if(product){
        const newCart = cart.filter(product => product.id !== productId)
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

       }else{

         toast.error('Erro na remoção do produto');
       }

    
      

    } catch {
      // TODO
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
        if (amount < 1) {
          return;
        }
  
        // check if product in cart
        const productInCart = cart.find(
          product => product.id === productId
        );
        if (!productInCart) {
          toast.error("Erro na alteração de quantidade do produto");
          return;
        }
  
        const responseStock = await api.get(`/stock/${productId}`);
        const productAmountInStock = responseStock.data.amount;
  
        if (productAmountInStock < amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
  
        // Update the cart in state and in localstorage
        const updatedCart = [...cart]
        const findIndex = updatedCart.findIndex(product => productId === product.id);
        
        updatedCart[findIndex].amount = amount;
  
        setCart(updatedCart);
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updatedCart)
        );
      } catch {
        toast.error("Erro na alteração de quantidade do produto");
      }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
