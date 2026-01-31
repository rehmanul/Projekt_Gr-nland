import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";

import Home from "@/pages/Home";
import JobSearch from "@/pages/JobSearch";
import JobDetails from "@/pages/JobDetails";
import Employers from "@/pages/Employers";
import EmployerDetail from "@/pages/EmployerDetail";
import PostJob from "@/pages/PostJob";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Imprint from "@/pages/Imprint";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import FAQ from "@/pages/FAQ";
import Pricing from "@/pages/Pricing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/jobs" component={JobSearch} />
        <Route path="/jobs/:id" component={JobDetails} />
        <Route path="/companies" component={Employers} />
        <Route path="/employers/:id" component={EmployerDetail} />
        <Route path="/post-job" component={PostJob} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/imprint" component={Imprint} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/faq" component={FAQ} />
        <Route path="/pricing" component={Pricing} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
