import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";

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

// Campaign Portal Pages
import CSDashboard from "@/pages/campaign/CSDashboard";
import CustomerPortal from "@/pages/campaign/CustomerPortal";
import AgencyPortal from "@/pages/campaign/AgencyPortal";
import { MagicLinkRequest, MagicLinkVerify } from "@/components/campaign/CampaignAuth";

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Campaign Portal Routes (no main layout) */}
        <Route path="/cs/login" component={() => <MagicLinkRequest portalType="cs" />} />
        <Route path="/cs/auth/verify" component={() => <MagicLinkVerify portalType="cs" />} />
        <Route path="/cs" component={CSDashboard} />
        <Route path="/cs/campaigns/:id" component={CSDashboard} />

        <Route path="/customer/login" component={() => <MagicLinkRequest portalType="customer" />} />
        <Route path="/customer/auth/verify" component={() => <MagicLinkVerify portalType="customer" />} />
        <Route path="/customer/campaign/:id" component={CustomerPortal} />

        <Route path="/agency/login" component={() => <MagicLinkRequest portalType="agency" />} />
        <Route path="/agency/auth/verify" component={() => <MagicLinkVerify portalType="agency" />} />
        <Route path="/agency/campaign/:id" component={AgencyPortal} />
        <Route path="/agency" component={AgencyPortal} />

        {/* Main Site Routes (with layout) */}
        <Route path="/">
          {() => (
            <Layout>
              <Home />
            </Layout>
          )}
        </Route>
        <Route path="/jobs">
          {() => (
            <Layout>
              <JobSearch />
            </Layout>
          )}
        </Route>
        <Route path="/jobs/:id">
          {(params: { id: string }) => (
            <Layout>
              <JobDetails />
            </Layout>
          )}
        </Route>
        <Route path="/companies">
          {() => (
            <Layout>
              <Employers />
            </Layout>
          )}
        </Route>
        <Route path="/employers/:id">
          {() => (
            <Layout>
              <EmployerDetail />
            </Layout>
          )}
        </Route>
        <Route path="/post-job">
          {() => (
            <Layout>
              <PostJob />
            </Layout>
          )}
        </Route>
        <Route path="/about">
          {() => (
            <Layout>
              <About />
            </Layout>
          )}
        </Route>
        <Route path="/contact">
          {() => (
            <Layout>
              <Contact />
            </Layout>
          )}
        </Route>
        <Route path="/imprint">
          {() => (
            <Layout>
              <Imprint />
            </Layout>
          )}
        </Route>
        <Route path="/privacy">
          {() => (
            <Layout>
              <Privacy />
            </Layout>
          )}
        </Route>
        <Route path="/terms">
          {() => (
            <Layout>
              <Terms />
            </Layout>
          )}
        </Route>
        <Route path="/faq">
          {() => (
            <Layout>
              <FAQ />
            </Layout>
          )}
        </Route>
        <Route path="/pricing">
          {() => (
            <Layout>
              <Pricing />
            </Layout>
          )}
        </Route>
        <Route>
          {() => (
            <Layout>
              <NotFound />
            </Layout>
          )}
        </Route>
      </Switch>
    </>
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

