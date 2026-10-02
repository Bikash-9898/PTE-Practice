import { Link, useParams, Navigate } from "react-router-dom";
import { getMockTestById, getMockTestQuestions } from "../../data/mockTests";
import Button from "../../components/common/Button";

export default function MockTestStart() {
  const { id } = useParams();
  const test = getMockTestById(id);
  const questions = getMockTestQuestions(id);

  if (!test) return <Navigate to="/mock-tests" replace />;

  const sections = [...new Set(questions.map((q) => q.section))];

  return (
    <div className="section-padding py-12">
      <div className="container-main max-w-xl">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold text-navy dark:text-white mb-2">Ready to begin?</h1>
          <p className="text-slate-500 mb-6">{test.title}</p>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-5 text-left text-sm space-y-2 mb-8">
            <p>
              <strong>Duration:</strong> {test.duration} minutes
            </p>
            <p>
              <strong>Questions in this demo set:</strong> {questions.length}
            </p>
            <p>
              <strong>Sections:</strong> {sections.join(", ")}
            </p>
            <p className="text-slate-400 pt-2">
              Once you start, the timer begins. You can still leave and return, but progress is kept
              in this browser session only.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/mock-tests/${id}`}>
              <Button variant="secondary">Cancel</Button>
            </Link>
            <Link to={`/mock-tests/${id}/exam`}>
              <Button size="lg">Begin Exam</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
