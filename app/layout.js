import "./globals.css";

export const metadata = {
  title: "發願器 WishMaker",
  description: "輸入願望，生成願望點數與可行性分析"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
