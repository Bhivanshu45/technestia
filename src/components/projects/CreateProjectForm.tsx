"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const createProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long"),
  techStack: z.array(z.string()).min(1, "Add at least one technology"),
  tags: z.array(z.string()).optional(),
  status: z.enum(["IDEA", "IN_PROGRESS", "COMPLETED"]),
  isPublic: z.boolean(),
  githubUrl: z.string().url("Invalid URL").or(z.literal("")),
  liveDemoUrl: z.string().url("Invalid URL").or(z.literal("")),
});

type FormData = z.infer<typeof createProjectSchema>;

const STEPS = [
  { id: 1, name: "Basic Info" },
  { id: 2, name: "Tech & Tags" },
  { id: 3, name: "Links & Visibility" },
  { id: 4, name: "Screenshots" },
];

const CreateProjectForm: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotError, setScreenshotError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [techInput, setTechInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      techStack: [],
      tags: [],
      status: "IDEA",
      isPublic: false,
      githubUrl: "",
      liveDemoUrl: "",
    },
  });

  const techStack = form.watch("techStack") || [];
  const tags = form.watch("tags") || [];

  const handleAddTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      form.setValue("techStack", [...techStack, techInput.trim()]);
      setTechInput("");
    }
  };

  const handleRemoveTech = (tech: string) => {
    form.setValue("techStack", techStack.filter((t) => t !== tech));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      form.setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    form.setValue("tags", tags.filter((t) => t !== tag));
  };

  const MAX_SCREENSHOTS = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const isAllowedType = (type: string) =>
    type.startsWith("image/") || type.startsWith("video/");

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setScreenshotError("");
      const files = Array.from(e.target.files);
      const validFiles = files.filter(
        (file) => isAllowedType(file.type) && file.size <= MAX_FILE_SIZE
      );

      const hasInvalidType = files.some((file) => !isAllowedType(file.type));
      const hasOversized = files.some((file) => file.size > MAX_FILE_SIZE);

      if (hasInvalidType) {
        setScreenshotError("Only image and video files are allowed.");
      } else if (hasOversized) {
        setScreenshotError("Each file must be 5MB or less.");
      }

      const combined = [...screenshots, ...validFiles].slice(0, MAX_SCREENSHOTS);
      if (combined.length < screenshots.length + validFiles.length) {
        setScreenshotError(`You can upload up to ${MAX_SCREENSHOTS} files only.`);
      }
      setScreenshots(combined);
    }
  };

  const handleRemoveScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotError("");
  };

  const convertFilesToBase64 = async (files: File[]): Promise<Array<{ name: string; type: string; buffer: string }>> => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise<{ name: string; type: string; buffer: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result?.toString().split(",")[1];
              if (base64) {
                resolve({ name: file.name, type: file.type, buffer: base64 });
              } else {
                reject(new Error("Failed to convert file"));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      setIsUploading(true);
      const screenshotData = await convertFilesToBase64(screenshots);
      setIsUploading(false);
      
      const payload = {
        ...data,
        screenshots: screenshotData,
      };

      const response = await axios.post("/api/project/create", payload);

      if (response.data.success) {
        toast.success("Project created successfully!");
        const createdId = response.data?.project?.id;
        if (createdId) {
          router.push(`/projects/${createdId}`);
        } else {
          router.push("/projects");
        }
      } else {
        const msg = response.data.message || "Failed to create project";
        setSubmitError(msg);
        toast.error(msg);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to create project";
      setSubmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["title", "description", "status"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["techStack"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["githubUrl", "liveDemoUrl", "isPublic"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#232326] border border-zinc-700 rounded-lg px-6 py-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
            <p className="text-sm text-white">Uploading files, please wait...</p>
          </div>
        </div>
      )}
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id
                    ? "bg-blue-700 border-blue-700 text-white"
                    : currentStep === step.id
                    ? "border-blue-700 text-blue-700 bg-transparent"
                    : "border-zinc-700 text-zinc-500 bg-transparent"
                }`}
              >
                {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.id ? "bg-blue-700" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-[#A1A1AA]">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="My Awesome Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project in detail..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IDEA">Idea</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Tech & Tags */}
          {currentStep === 2 && (
            <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Tech Stack & Tags</h2>
              
              <div>
                <FormLabel>Tech Stack *</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add technology (e.g., React, Node.js)"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTech();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTech} variant="secondary">
                    Add
                  </Button>
                </div>
                {techStack.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {techStack.map((tech) => (
                      <Badge key={tech} variant="default" className="gap-1">
                        {tech}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTech(tech)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                {form.formState.errors.techStack && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.techStack.message}
                  </p>
                )}
              </div>

              <div>
                <FormLabel>Tags (Optional)</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add tag (e.g., web-app, mobile)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} variant="secondary">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Links & Visibility */}
          {currentStep === 3 && (
            <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Links & Visibility</h2>
              
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username/repo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="liveDemoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Live Demo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://myproject.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0 pt-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-zinc-700 bg-[#18181b] text-blue-700 focus:ring-2 focus:ring-blue-600"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">
                      Make this project public
                    </FormLabel>
                  </FormItem>
                )}
              />
              <p className="text-xs text-[#A1A1AA]">
                Public projects can be viewed by anyone on the explore page.
              </p>
            </div>
          )}

          {/* Step 4: Screenshots */}
          {currentStep === 4 && (
            <div className="bg-[#232326] border border-zinc-800 rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Screenshots</h2>
              
              <div>
                <FormLabel>Upload Screenshots (Optional, Max 5)</FormLabel>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleScreenshotsChange}
                  className="mt-2"
                />
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Upload images or videos of your project (max 5 files, up to 5MB each)
                </p>
                {screenshotError && (
                  <p className="text-sm text-red-500 mt-2">{screenshotError}</p>
                )}
              </div>

              {screenshots.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {screenshots.map((file, index) => (
                    <div
                      key={index}
                      className="relative group border border-zinc-700 rounded-lg overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveScreenshot(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="gap-2 bg-[#1f1f23] text-white border border-zinc-700 hover:bg-[#2a2a2f]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            )}
          </div>
          {submitError && (
            <p className="text-sm text-red-500 mt-3">{submitError}</p>
          )}
        </form>
      </Form>
    </div>
  );
};

export default CreateProjectForm;
