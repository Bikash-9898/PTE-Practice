import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import Button from "../common/Button";

export default function PracticeNavigation({
  onPrev,
  onNext,
  disablePrev,
  disableNext,
  nextLabel = "Next",
  children,
}) {
  return (
    <div className="flex flex-wrap justify-between gap-3 mt-6">
      <Button variant="secondary" onClick={onPrev} disabled={disablePrev}>
        <FiChevronLeft /> Previous
      </Button>
      <div className="flex gap-2">{children}</div>
      <Button onClick={onNext} disabled={disableNext}>
        {nextLabel} <FiChevronRight />
      </Button>
    </div>
  );
}
