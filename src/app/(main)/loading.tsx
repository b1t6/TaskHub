import { Skeleton } from "antd";

export default function MainLoading() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Skeleton active title paragraph={{ rows: 8 }} />
    </div>
  );
}
