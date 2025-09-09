"use client";

import { ChevronDown, ChevronRight, Plus, Trash2, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import type { OutputStructure, OutputTemplate, StructureField } from "./types";
import { defaultTemplates } from "./types";

interface StructuredOutputConfigProps {
  outputStructure: OutputStructure;
  onStructureChange: (structure: OutputStructure) => void;
}

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "date", label: "Date" },
  { value: "currency", label: "Currency" },
  { value: "phone", label: "Phone" },
] as const;

export function StructuredOutputConfig({ outputStructure, onStructureChange }: StructuredOutputConfigProps) {
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isFieldsOpen, setIsFieldsOpen] = useState(true);

  const handleNameChange = (name: string) => {
    onStructureChange({
      ...outputStructure,
      name
    });
  };

  const handleDescriptionChange = (description: string) => {
    onStructureChange({
      ...outputStructure,
      description
    });
  };

  const handleAddField = () => {
    const newField: StructureField = {
      key: `field_${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false
    };

    onStructureChange({
      ...outputStructure,
      fields: [...outputStructure.fields, newField]
    });
  };

  const handleUpdateField = (index: number, updates: Partial<StructureField>) => {
    const updatedFields = outputStructure.fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );

    onStructureChange({
      ...outputStructure,
      fields: updatedFields
    });
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = outputStructure.fields.filter((_, i) => i !== index);

    onStructureChange({
      ...outputStructure,
      fields: updatedFields
    });
  };

  const handleLoadTemplate = (template: OutputTemplate) => {
    onStructureChange(template.structure);
  };

  const handleClearStructure = () => {
    onStructureChange({
      name: "Custom Structure",
      description: "",
      fields: []
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Structure Configuration */}
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="structure-name">Structure Name</Label>
            <Input
              id="structure-name"
              value={outputStructure.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter structure name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="structure-description">Description (Optional)</Label>
            <Textarea
              id="structure-description"
              value={outputStructure.description || ""}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Describe what this structure is for"
              rows={2}
            />
          </div>
        </div>

        {/* Fields Configuration */}
        <Collapsible open={isFieldsOpen} onOpenChange={setIsFieldsOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 hover:bg-transparent">
                {isFieldsOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                <span className="font-medium">Output Fields ({outputStructure.fields.length})</span>
              </Button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-2">
              {outputStructure.fields.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearStructure}>
                  Clear All
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleAddField}>
                <Plus className="size-4 mr-1" />
                Add Field
              </Button>
            </div>
          </div>

          <CollapsibleContent className="mt-4">
            {outputStructure.fields.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No fields defined yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add fields to define the structure of your OCR output.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {outputStructure.fields.map((field, index) => (
                  <Card key={field.key}>
                    <CardContent className="p-4">
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`field-key-${index}`} className="text-xs">Field Key</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="size-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">
                                    The unique identifier used in the JSON output. Use lowercase with underscores (e.g., "phone_number", "email_address").
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id={`field-key-${index}`}
                              value={field.key}
                              onChange={(e) => handleUpdateField(index, { key: e.target.value })}
                              placeholder="field_key"
                              className="text-sm"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Label htmlFor={`field-label-${index}`} className="text-xs">Display Label</Label>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="size-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-xs">
                                    The human-readable name shown in the results. This is what users will see (e.g., "Phone Number", "Email Address").
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Input
                              id={`field-label-${index}`}
                              value={field.label}
                              onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                              placeholder="Field Label"
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor={`field-type-${index}`} className="text-xs">Field Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value: StructureField['type']) =>
                                handleUpdateField(index, { type: value })
                              }
                            >
                              <SelectTrigger id={`field-type-${index}`} className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end gap-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`field-required-${index}`}
                                checked={field.required || false}
                                onCheckedChange={(checked) =>
                                  handleUpdateField(index, { required: !!checked })
                                }
                              />
                              <Label htmlFor={`field-required-${index}`} className="text-xs">
                                Required
                              </Label>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveField(index)}
                              className="shrink-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {field.description !== undefined && (
                          <div className="space-y-1">
                            <Label htmlFor={`field-description-${index}`} className="text-xs">
                              Description (Optional)
                            </Label>
                            <Input
                              id={`field-description-${index}`}
                              value={field.description}
                              onChange={(e) => handleUpdateField(index, { description: e.target.value })}
                              placeholder="Field description"
                              className="text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
      </div>
    </TooltipProvider>
  );
}
