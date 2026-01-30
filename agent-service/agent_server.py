import logging
import time
from concurrent import futures

import grpc

import apply_service_pb2
import apply_service_pb2_grpc
from chains.cover_letter_chain import run_cover_letter_chain
from chains.question_answering_chain import run_question_answering_chain
from chains.resume_chain import run_resume_chain
from chains.orchestrator_chain import run_orchestrator_chain
from chains.agentic_orchestrator import run_agentic_orchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ApplyService(apply_service_pb2_grpc.ApplyServiceServicer):
    def Apply(self, request, context):
        application_id = f"app-{int(time.time() * 1000)}"
        job_title = request.job.title or "Unknown role"
        applicant = request.profile.name or "Applicant"

        refined_resume = run_resume_chain(
            job_obj=request.job,
            profile_obj=request.profile,
        )
        message = f"{applicant} applied to {job_title}. Refined resume:\n{refined_resume}"

        return apply_service_pb2.ApplyResponse(
            success=True,
            message=message,
            application_id=application_id,
        )

    def GenerateCoverLetter(self, request, context):
        cover_letter = run_cover_letter_chain(
            job_obj=request.job,
            profile_obj=request.profile,
        )
        return apply_service_pb2.CoverLetterResponse(
            success=True,
            cover_letter=cover_letter,
            message="Cover letter generated",
        )

    def AnswerQuestions(self, request, context):
        """Generate answers to application questions."""
        # Convert protobuf questions to dict format
        questions = [{
            "question": q.question,
            "type": q.type,
            "options": list(q.options) if q.options else []
        } for q in request.questions]

        # Run the question answering chain
        answers = run_question_answering_chain(
            job_obj=request.job,
            profile_obj=request.profile,
            questions=questions
        )

        # Convert to protobuf response
        response_answers = [
            apply_service_pb2.Answer(
                question=a["question"],
                answer=a["answer"]
            ) for a in answers
        ]

        return apply_service_pb2.AnswerResponse(
            success=True,
            answers=response_answers,
            message="Questions answered successfully"
        )

    def AutoApply(self, request, context):
        """Full auto-apply orchestration."""
        import sys
        logger.info("AUTO_APPLY received request for job: %s", request.job.title)

        # Convert questions to dict format
        questions = [{
            "question": q.question,
            "type": q.type,
            "options": list(q.options) if q.options else []
        } for q in request.questions] if request.questions else None

        logger.info("AUTO_APPLY converted %s questions", len(questions) if questions else 0)

        # Run agentic orchestrator
        logger.info("AUTO_APPLY starting agentic orchestrator...")
        result = run_agentic_orchestrator(
            job_obj=request.job,
            profile_obj=request.profile,
            questions=questions
        )
        logger.info("AUTO_APPLY agentic orchestrator completed with success=%s", result['success'])

        # Generate application ID
        application_id = f"app-{int(time.time() * 1000)}"

        # Convert answers to protobuf
        response_answers = [
            apply_service_pb2.Answer(
                question=a["question"],
                answer=a["answer"]
            ) for a in result.get("answers", [])
        ]

        return apply_service_pb2.AutoApplyResponse(
            success=result["success"],
            message=result["message"],
            refined_resume=result["refined_resume"],
            cover_letter=result["cover_letter"],
            answers=response_answers,
            application_id=application_id
        )


def serve(port: int = 50051):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    apply_service_pb2_grpc.add_ApplyServiceServicer_to_server(ApplyService(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info("ApplyService gRPC server listening on port %s", port)
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
