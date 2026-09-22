import SearchBar from "@/app/components/SearchBar";

export function Hero() {
  return (
    <section className="bg-navy">
      <div className="flex flex-col items-center gap-6 pt-8 text-center sm:pt-12">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Find work shaping the future of AI.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
          We connect AI labs and platforms with vetted experts for model
          evaluation, data annotation and quality work — reliable talent at any
          scale, whenever you need it.
        </p>
        <SearchBar />
      </div>
    </section>
  );
}

export default Hero;