import { AppHeader } from "@/components/navigation/app-header";
import { ProviderConfig } from "@/features/models/provider-config";
import { ProviderSelection } from "@/features/models/provider-selection";
import type { AIProvider } from "@athena/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/models.add";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Add Model Configuration - Athena AI" },
    {
      name: "description",
      content: "Add a new AI model configuration",
    },
  ];
}

type AIProviderOrNull = AIProvider | null;

export default function ModelsAdd() {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] =
    useState<AIProviderOrNull>(null);
  const [step, setStep] = useState<"selection" | "configuration">("selection");

  const handleProviderSelect = (provider: AIProviderOrNull) => {
    setSelectedProvider(provider);
    setStep("configuration");
  };

  const handleBack = () => {
    if (step === "configuration") {
      setSelectedProvider(null);
      setStep("selection");
    } else {
      navigate("/models");
    }
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Models Hub", href: "/models" },
          { label: "Add Configuration", isCurrentPage: true },
        ]}
      />
      <div className="flex-1 space-y-4 p-4 md:p-6">
        {step === "selection" && (
          <ProviderSelection
            onProviderSelect={handleProviderSelect}
            onBack={handleBack}
          />
        )}
        {step === "configuration" && selectedProvider && (
          <ProviderConfig provider={selectedProvider} onBack={handleBack} />
        )}
      </div>
    </>
  );
}
