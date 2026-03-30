import React from "react";
import { Button } from "./ui/button";
import {
  PenBox,
  LayoutDashboard,
  FileText,
  GraduationCap,
  ChevronDown,
  StarsIcon,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { checkUser } from "@/lib/checkUser";

export default async function Header() {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (hasClerkKey) {
    await checkUser();
  }

  return (
    <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Career Coach
          </div>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {hasClerkKey ? (
            <>
              <SignedIn>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="hidden md:inline-flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Industry Insights
                  </Button>
                  <Button variant="ghost" className="md:hidden w-10 h-10 p-0">
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <StarsIcon className="h-4 w-4" />
                      <span className="hidden md:block">Growth Tools</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/resume" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Build Resume
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/ai-cover-letter"
                        className="flex items-center gap-2"
                      >
                        <PenBox className="h-4 w-4" />
                        Cover Letter
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/interview" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Interview Prep
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ats-score" className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        ATS Score Check
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SignedIn>

              <SignedOut>
                <SignInButton>
                  <Button variant="outline">Sign In</Button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "shadow-xl",
                      userPreviewMainIdentifier: "font-semibold",
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </>
          ) : (
            <Button variant="outline" disabled>
              Auth Not Configured
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
