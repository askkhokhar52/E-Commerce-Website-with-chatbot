import ProductListSec from "@/components/common/ProductListSec";
import Brands from "@/components/homepage/Brands";
import DressStyle from "@/components/homepage/DressStyle";
import Header from "@/components/homepage/Header";
import Reviews from "@/components/homepage/Reviews";
import { getProductsFromSheet } from "@/lib/googleSheets";
import {
  newArrivalsData,
  topSellingData,
  reviewsData,
} from "@/lib/data";

export const revalidate = 30;

export default async function Home() {
  const sheetProducts = await getProductsFromSheet();
  const arrivalsToDisplay = sheetProducts.length > 0 ? sheetProducts : newArrivalsData;

  return (
    <>
      <Header />
      <Brands />
      <main className="my-[50px] sm:my-[72px]">
        <ProductListSec
          title={sheetProducts.length > 0 ? "ITEMS FROM GOOGLE SHEET" : "NEW ARRIVALS"}
          data={arrivalsToDisplay}
          viewAllLink="/shop#new-arrivals"
        />
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <ProductListSec
            title="top selling"
            data={topSellingData}
            viewAllLink="/shop#top-selling"
          />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <DressStyle />
        </div>
        <Reviews data={reviewsData} />
      </main>
    </>
  );
}
