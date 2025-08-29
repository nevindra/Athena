import { useState } from "react";
import { AppHeader } from "~/components/app-header";
import { ProviderConfig } from "@/features/models/provider-config";
import { ProviderSelection } from "@/features/models/provider-selection";
import { ConfigurationList } from "@/features/models/configuration-list";
import { AddNewConfiguration } from "@/features/models/add-new-configuration";
import { useConfigurations } from "~/hooks/use-configurations";
import type { Route } from "./+types/models";
import type { AIProvider, AIConfiguration } from "@athena/shared";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Models Hub - Athena AI" },
    {
      name: "description",
      content: "Configure and manage your AI model providers",
    },
  ];
}

type AIProviderOrNull = AIProvider | null;

export default function Models() {
  const { data: configurations, isLoading } = useConfigurations();
  const [selectedProvider, setSelectedProvider] = useState<AIProviderOrNull>(null);
  const [step, setStep] = useState<"list" | "selection" | "configuration">("list");
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);

  const handleProviderSelect = (provider: AIProviderOrNull) => {
    setSelectedProvider(provider);
    setStep("configuration");
  };


  const handleEditConfiguration = (config: AIConfiguration) => {
    setEditingConfig(config);
    setSelectedProvider(config.provider);
    setStep("configuration");
  };

  const handleBack = () => {
    setEditingConfig(null);
    setSelectedProvider(null);
    
    // Go back to list if we came from configuration, or selection if we came from provider selection
    if (step === "configuration") {
      setStep("list");
    } else {
      setStep("list");
    }
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Models Hub", isCurrentPage: true },
        ]}
      />
      <div className="flex-1 space-y-4 p-4 md:p-6">
        {step === "list" && !isLoading && (
          !configurations || configurations.length === 0 ? (
            <AddNewConfiguration />
          ) : (
            <ConfigurationList onEditConfiguration={handleEditConfiguration} />
          )
        )}
        {step === "list" && isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-muted-foreground">Loading configurations...</div>
          </div>
        )}
        {step === "selection" && (
          <ProviderSelection onProviderSelect={handleProviderSelect} onBack={handleBack} />
        )}
        {step === "configuration" && selectedProvider && (
          <ProviderConfig 
            provider={selectedProvider} 
            onBack={handleBack}
            editingConfig={editingConfig}
          />
        )}
      </div>
    </>
  );
}
