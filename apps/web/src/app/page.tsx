import AppLayout from "@/components/app/layout/AppLayout";
import Screen from "@/components/app/layout/Screen";
import Header from "@/components/app/navigation/Header";
import TabBar from "@/components/app/navigation/TabBar";

const HomePage = () => (
  <AppLayout
    header={<Header title="ワードローブ名" />}
    tabBar={<TabBar />}
  >
    <Screen>
      <section className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        ホーム画面のコンテンツ
      </section>
    </Screen>
  </AppLayout>
);

export default HomePage;
