import { useCallback, useContext, useEffect, useState } from "react";
import CardLayout from "../common/CardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader } from "../ui/alert-dialog";
import { ProductInputs, Item } from "@/global/Types";
import productApi from "@/api/productApi";
import { FaBasketShopping } from "react-icons/fa6";
import ProductQuantitySelection from "./ProductQuantitySelection";
import salesApi from "@/api/salesApi";
import { ToastContext } from "@/contexts/ToastContext";

export default function ProductSelectorModalContent(props: { children: React.ReactNode, setSelectedProductsOnSalesPage: Function, selectedProductsOnSalesPage: Item[]}) {
   const { children, setSelectedProductsOnSalesPage, selectedProductsOnSalesPage } = props;

   const [productList, setProductList] = useState<ProductInputs[]>([]);
   const [selectedItems, setSelectedItems] = useState<Item[]>([]);

   const {successToast, errorToast} = useContext(ToastContext);

   useEffect(() => {
      productApi.get(0)
         .then(res => {
            setProductList(res.data.content);
         })
         .catch(error => console.error("Erro no servidor"));
   }, []);

   function selectProduct(product: ProductInputs) {
      isOutOfStock(product.estoque) ? 
      errorToast("Produto fora de estoque!") :
      setSelectedItems(current => [...current, {product:product, quantity:1}]);
   }

   function isAlreadySelected(id: number = 0) {
      return selectedItems.some(item => item.product.id === id) || selectedProductsOnSalesPage.some(item => item.product.id === id);
   }

   function removeProduct(id:number) {
      const array = selectedItems.filter(item => item.product.id !== id);
      setSelectedItems(array);
   }

   const changeQuantity = useCallback((id:number, quantity:number) => {
      let aux = [...selectedItems];
      const index = aux.findIndex(item => item.product.id === id);

      if(aux[index].quantity  !== quantity) {
         aux[index].quantity  = quantity;
         setSelectedItems(aux);
      }
   },[selectedItems]);

   function send() {
      setSelectedProductsOnSalesPage((current: Item[]) => [...current.concat(selectedItems)]);

      const formattedItems = selectedItems.map(item => {
         const {product, quantity} = item;
         return {
            quantidade:quantity,
            produtoId:product.id 
         }
      });

      salesApi.postItems(formattedItems).then(res => {
         successToast("Item adicionado com sucesso!");
         setSelectedItems([]);
      }).catch(error => {
         errorToast("Erro ao adicionar item!");
      });
   }

   function isOutOfStock(stockNumber: number) {
      return stockNumber === 0 ? true : false;
   }

   return <AlertDialog>
         <AlertDialogContent className="max-w-none w-[1450px] h-[780px] flex flex-col bg-primaria">
            <AlertDialogHeader className="max-h-[30px]">
               <h1 className="text-[20px]"> Produto</h1>
            </AlertDialogHeader>
               <div className="max-h-full h-full grow flex justify-between">
                  <div className="grow max-h-full h-full flex flex-col mr-3">
                     <div className="h-[60px] mb-3">
                        <CardLayout>
                           <div className="w-full">

                           </div>
                        </CardLayout>
                     </div>
                     <div className="h-max-full h-full w-full grow">
                        <CardLayout>
                           <div className="max-h-full h-full w-full overflow-y-auto">
                              <div className="grow h-[200px] px-3">
                                 <table className="w-full text-center">
                                    <thead className="w-full [&>th]:py-2 sticky top-0 bg-[#fdfdfd] border-b">
                                       <tr className="[&>th]:py-1">
                                          <th>ID</th>
                                          <th>DESCRIÇÃO</th>
                                          <th>ESTOQUE</th>
                                          <th>UNIDADE DE MEDIDA</th>
                                          <th>PREÇO</th>
                                          <th colSpan={2}>CÓDIGO DE BARRAS</th>
                                       </tr>
                                    </thead>
                                    <tbody>
                                       {
                                          productList.map((product: ProductInputs, i: number) => (
                                             !isAlreadySelected(product.id) &&

                                             <tr key={i} className={`border-t [&>td]:py-1 hover:bg-terciaria hover:text-textoContraste ${isOutOfStock(product.estoque) && "bg-gray-200"}`}>
                                                <td>{product.id}</td>
                                                <td>{product.descricao}</td>
                                                <td>{product.estoque}</td>
                                                <td>{product.unidadeMedida}</td>
                                                <td>R$ {product.preco}</td>
                                                <td>{product.codigoBarrasEAN13}</td>
                                                <td>
                                                   <FaBasketShopping title="Adicionar no carrinho de compra" size={18} className="cursor-pointer transition" onClick={() => selectProduct(product)} />
                                                </td>
                                             </tr>
                                          ))
                                       }
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </CardLayout>
                     </div>
                  </div>
                  <div className="h-full">
                     <CardLayout>
                        <div className="max-h-full h-full w-[300px] p-5">
                           <div className="overflow-auto h-[590px] pr-1">
                              <div className="flex w-full justify-between mb-3">
                                 <p className="flex items-center">Descrição</p>
                                 <div>
                                    Qtd.
                                 </div>
                              </div>
                              <div>
                                 {
                                    selectedItems.map(({product: product}, i) => (
                                       <ProductQuantitySelection product={product} removeProduct={removeProduct} changeQuantity={changeQuantity} key={i} />
                                    ))
                                 }
                              </div>
                           </div>
                        </div>
                     </CardLayout>
                  </div>
               </div>
            <AlertDialogFooter className="min-h-[40px]">
               <AlertDialogCancel>
                  Cancelar
               </AlertDialogCancel>
               <AlertDialogAction onClick={() => send()}>
                  Confirmar
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      {children}
   </AlertDialog>

}