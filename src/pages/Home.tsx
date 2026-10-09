import { useEffect } from "react";
import { HomeSections } from "@/sections/home";

export default function Home() {
  useEffect(() => {
    document.title = "CroChic — handmade with elegance";
  }, []);
  return <HomeSections />;
}
