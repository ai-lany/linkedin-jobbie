import time
from concurrent import futures

import grpc

import apply_service_pb2
import apply_service_pb2_grpc
from chains import run_resume_chain


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


def serve(port: int = 50051):
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    apply_service_pb2_grpc.add_ApplyServiceServicer_to_server(ApplyService(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    print(f"ApplyService gRPC server listening on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
