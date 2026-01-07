export default function Custom404() {
  return null;
}

// Redirect to App Router's not-found page
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}
