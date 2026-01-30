#!/usr/bin/env python3
"""
Test script for agentic orchestrator
"""
import grpc
import sys
import os

# Add agent-service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agent-service'))

import apply_service_pb2
import apply_service_pb2_grpc


def test_agentic_orchestrator():
    """Test the agentic orchestrator via gRPC"""
    print("🧪 Testing Agentic Orchestrator")
    print("=" * 50)

    # Connect to gRPC service
    channel = grpc.insecure_channel('localhost:50051')
    stub = apply_service_pb2_grpc.ApplyServiceStub(channel)

    # Create test job and profile
    job = apply_service_pb2.Job(
        id="test-123",
        title="Senior Software Engineer",
        company="Test Company",
        location="San Francisco, CA",
        description="Looking for an experienced engineer with Python and AI skills.",
        easy_apply=True
    )

    profile = apply_service_pb2.Profile(
        name="John Doe",
        email="john@example.com",
        resume_text="Experienced software engineer with 5 years in Python, AI/ML, and backend systems."
    )

    # Create test questions
    questions = [
        apply_service_pb2.Question(
            question="Why do you want to work here?",
            type="text"
        ),
        apply_service_pb2.Question(
            question="Do you have Python experience?",
            type="boolean"
        )
    ]

    # Create request
    request = apply_service_pb2.AutoApplyRequest(
        job=job,
        profile=profile,
        questions=questions
    )

    print("\n📤 Sending request to agentic orchestrator...")
    print(f"   Job: {job.title} at {job.company}")
    print(f"   Questions: {len(questions)}")

    try:
        # Call the AutoApply RPC
        response = stub.AutoApply(request)

        print("\n✅ Response received!")
        print(f"   Success: {response.success}")
        print(f"   Message: {response.message}")
        print(f"\n📄 Resume length: {len(response.refined_resume)} chars")
        print(f"📝 Cover letter length: {len(response.cover_letter)} chars")
        print(f"❓ Answers: {len(response.answers)}")

        if response.answers:
            print("\n   Answer details:")
            for i, answer in enumerate(response.answers, 1):
                print(f"   {i}. Q: {answer.question[:50]}...")
                print(f"      A: {answer.answer[:80]}...")

        print("\n" + "=" * 50)
        print("✨ Agentic orchestrator test PASSED!")
        return True

    except grpc.RpcError as e:
        print(f"\n❌ gRPC Error: {e.code()}: {e.details()}")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_agentic_orchestrator()
    sys.exit(0 if success else 1)
