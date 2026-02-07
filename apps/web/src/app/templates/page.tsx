import AppLayout from "@/components/app/layout/AppLayout";
import Screen from "@/components/app/layout/Screen";
import Header from "@/components/app/navigation/Header";
import BackButton from "@/components/app/navigation/BackButton";
import TabBar from "@/components/app/navigation/TabBar";

const TemplatesPage = () => (
  <AppLayout
    header={<Header title="テンプレート" left={<BackButton />} />}
    tabBar={<TabBar />}
  >
    <Screen>
      <section className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
        テンプレート一覧のコンテンツ
      </section>
    </Screen>
  </AppLayout>
);

export default TemplatesPage;
