"use client";

interface Props {
  action: () => Promise<void>;
  label?: string;
}

export function DeleteButton({ action, label = "삭제" }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) e.preventDefault();
      }}
    >
      <button type="submit" className="cms-del-btn">{label}</button>
    </form>
  );
}
