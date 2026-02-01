export default function FormDivider() {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-gray-200"></div>
      <span className="text-sm text-gray-500 font-medium">หรือ</span>
      <div className="flex-1 h-px bg-gray-200"></div>
    </div>
  );
}
